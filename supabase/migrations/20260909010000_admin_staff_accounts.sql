-- ============================================================================
-- Admin user-management RPCs for the Admin -> Users page.
-- Mirrors how staff accounts are provisioned today (a confirmed email/password
-- auth user linked to a profile, a role row and an optional office binding),
-- but callable from the Admin panel. SECURITY DEFINER lets the function run as
-- its owner (the migration runner) so an admin JWT can create auth.users rows;
-- the caller must still be an admin (checked via has_role). All writes happen
-- in one transaction.
-- Applies to the live DB via Supabase SQL editor / db push.
-- ============================================================================

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
  v_code    text := btrim(p_user_code);
  v_name    text := btrim(p_full_name);
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can create accounts';
  END IF;

  IF v_name = '' OR v_code = '' OR v_email = '' THEN
    RAISE EXCEPTION 'Name, user code and email are required';
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

-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_reset_password(
  p_user_id uuid,
  p_password text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $fn$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only administrators can reset passwords';
  END IF;

  IF char_length(p_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(p_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.admin_reset_password(uuid, text) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.admin_reset_password(uuid, text) TO authenticated;