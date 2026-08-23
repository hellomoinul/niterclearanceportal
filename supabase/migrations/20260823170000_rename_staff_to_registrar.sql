-- Migration: Rename staff → registrar (full sweep)
-- Renames the DB enum value, table, function, all policies, and trigger functions.
-- Also hard-codes the Accounts hard-rule into registrar_in_department.

BEGIN;

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. Rename the enum value
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TYPE public.app_role RENAME VALUE 'staff' TO 'registrar';

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. Rename the table
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.staff_departments RENAME TO registrar_departments;

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. Drop policies that depend on staff_in_department BEFORE dropping function
-- ──────────────────────────────────────────────────────────────────────────────
-- department_reviews: policies referencing staff_in_department
DROP POLICY IF EXISTS "reviews readable" ON public.department_reviews;
DROP POLICY IF EXISTS "staff and admin update reviews" ON public.department_reviews;
-- registrar_departments: old policies
DROP POLICY IF EXISTS "staff read own assignments" ON public.registrar_departments;
-- storage.objects
DROP POLICY IF EXISTS "staff read clearance docs" ON storage.objects;

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. Drop the old function (must drop before recreating with new name + new body)
-- ──────────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.staff_in_department(uuid, uuid);

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. Create registrar_in_department
--    Hard-rule: registrars can ONLY touch the Accounts department unless
--    explicitly assigned more offices via registrar_departments.
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.registrar_in_department(
  _user_id uuid,
  _department_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- explicit assignment (any role)
  SELECT EXISTS (
    SELECT 1 FROM public.registrar_departments
    WHERE user_id = _user_id AND department_id = _department_id
  )
  OR
  -- hard-rule: registrars always get accounts
  (
    public.has_role(_user_id, 'registrar')
    AND EXISTS (
      SELECT 1 FROM public.departments d
      WHERE d.id = _department_id AND d.code = 'accounts'
    )
  )
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. Recreate policies on registrar_departments (table renamed, policies need ON table ref)
-- ──────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "staff read own assignments" ON public.registrar_departments;
CREATE POLICY "registrar read own assignments"
  ON public.registrar_departments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "admins manage assignments" ON public.registrar_departments;
CREATE POLICY "admins manage assignments"
  ON public.registrar_departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. Recreate policies with 'registrar' literal (was 'staff')
-- ──────────────────────────────────────────────────────────────────────────────

-- profiles: "own profile readable"
DROP POLICY IF EXISTS "own profile readable" ON public.profiles;
CREATE POLICY "own profile readable"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'registrar')
  );

-- clearance_applications: "students read own application"
DROP POLICY IF EXISTS "students read own application" ON public.clearance_applications;
CREATE POLICY "students read own application"
  ON public.clearance_applications FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR public.has_role(auth.uid(), 'registrar')
    OR public.has_role(auth.uid(), 'admin')
  );

-- department_reviews: "reviews readable" — now uses registrar_in_department
DROP POLICY IF EXISTS "reviews readable" ON public.department_reviews;
CREATE POLICY "reviews readable"
  ON public.department_reviews FOR SELECT TO authenticated
  USING (
    public.owns_application(auth.uid(), application_id)
    OR public.registrar_in_department(auth.uid(), department_id)
    OR public.has_role(auth.uid(), 'admin')
  );

-- department_reviews: "staff and admin update reviews"
DROP POLICY IF EXISTS "staff and admin update reviews" ON public.department_reviews;
CREATE POLICY "registrar and admin update reviews"
  ON public.department_reviews FOR UPDATE TO authenticated
  USING (public.registrar_in_department(auth.uid(), department_id) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.registrar_in_department(auth.uid(), department_id) OR public.has_role(auth.uid(), 'admin'));

-- storage.objects: "staff read clearance docs"
DROP POLICY IF EXISTS "staff read clearance docs" ON storage.objects;
CREATE POLICY "registrar read clearance docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'clearance-docs'
    AND (public.has_role(auth.uid(), 'registrar') OR public.has_role(auth.uid(), 'admin'))
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- 7. Recreate REVOKE/GRANT on the new function
-- ──────────────────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.registrar_in_department(uuid, uuid) FROM anon, PUBLIC;
GRANT  EXECUTE ON FUNCTION public.registrar_in_department(uuid, uuid) TO authenticated;

-- ──────────────────────────────────────────────────────────────────────────────
-- 8. Recreate can_see_review (SECURITY DEFINER, references function)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.can_see_review(
  _user_id uuid,
  _review_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.department_reviews r
    JOIN public.clearance_applications a ON a.id = r.application_id
    WHERE r.id = _review_id
      AND (a.student_id = _user_id
        OR public.registrar_in_department(_user_id, r.department_id)
        OR public.has_role(_user_id, 'admin'))
  )
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 9. Recreate reviewer_display_name (SECURITY DEFINER, references function)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reviewer_display_name(_review_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.full_name
  FROM public.department_reviews r
  JOIN public.profiles p ON p.id = r.reviewed_by
  WHERE r.id = _review_id
    AND (
      EXISTS (
        SELECT 1 FROM public.clearance_applications a
        WHERE a.id = r.application_id AND a.student_id = auth.uid()
      )
      OR public.registrar_in_department(auth.uid(), r.department_id)
      OR public.has_role(auth.uid(), 'admin')
    )
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 10. Recreate handle_review_rejection (references registrar_departments)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_review_rejection()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dept_name   text;
  student_label text;
  watchers    uuid[];
BEGIN
  IF OLD.status = 'rejected' THEN
    RETURN NEW;
  END IF;

  SELECT d.name INTO dept_name FROM public.departments d WHERE d.id = NEW.department_id;

  SELECT p.user_code || ' · ' || p.full_name INTO student_label
  FROM public.clearance_applications a
  JOIN public.profiles p ON p.id = a.student_id
  WHERE a.id = NEW.application_id;

  SELECT coalesce(array_agg(t.user_id), '{}') INTO watchers
  FROM (
    SELECT rd.user_id
    FROM public.registrar_departments rd
    JOIN public.departments d ON d.id = rd.department_id
    WHERE d.is_final_signoff AND rd.user_id <> auth.uid()
    UNION
    SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'admin'
  ) AS t;

  IF cardinality(watchers) > 0 THEN
    INSERT INTO public.notifications (user_id, title, body)
    SELECT w,
      'Escalation: ' || dept_name,
      'Student ' || coalesce(student_label, 'unknown') || ' has been rejected '
        || NEW.attempts || ' time(s) in ' || coalesce(dept_name, 'a department') || '.'
    FROM unnest(watchers) w;
  END IF;

  RETURN NEW;
END;
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 11. Drop + recreate notify_staff_on_review → notify_registrars_on_review
-- ──────────────────────────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_notify_staff_on_review ON public.department_reviews;
DROP FUNCTION IF EXISTS public.notify_staff_on_review();

CREATE OR REPLACE FUNCTION public.notify_registrars_on_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_name text;
  student_code text;
  dept_name    text;
  registrar_row record;
BEGIN
  SELECT full_name, user_code INTO student_name, student_code
  FROM public.profiles WHERE id = (
    SELECT student_id FROM public.clearance_applications WHERE id = NEW.application_id
  );

  SELECT name INTO dept_name FROM public.departments WHERE id = NEW.department_id;

  FOR registrar_row IN
    SELECT rd.user_id
    FROM public.registrar_departments rd
    WHERE rd.department_id = NEW.department_id
  LOOP
    INSERT INTO public.notifications (user_id, title, body)
    VALUES (
      registrar_row.user_id,
      dept_name || ': new clearance request',
      format(
        '%s (%s) has submitted a clearance application. Your review is pending.',
        COALESCE(student_name, 'Unknown'),
        COALESCE(student_code, '—')
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_registrars_on_review
AFTER INSERT ON public.department_reviews
FOR EACH ROW
EXECUTE FUNCTION public.notify_registrars_on_review();

REVOKE EXECUTE ON FUNCTION public.notify_registrars_on_review() FROM anon, authenticated, PUBLIC;

-- ──────────────────────────────────────────────────────────────────────────────
-- 12. Recreate notify_on_resubmit (references registrar_departments)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.notify_on_resubmit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_name text;
  student_code text;
  dept_name    text;
  recipient    record;
BEGIN
  SELECT full_name, user_code INTO student_name, student_code
  FROM public.profiles WHERE id = (
    SELECT student_id FROM public.clearance_applications WHERE id = NEW.application_id
  );

  SELECT name INTO dept_name FROM public.departments WHERE id = NEW.department_id;

  FOR recipient IN
    SELECT rd.user_id AS uid
      FROM public.registrar_departments rd
      WHERE rd.department_id = NEW.department_id
    UNION
    SELECT ur.user_id AS uid
      FROM public.user_roles ur WHERE ur.role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, body)
    VALUES (
      recipient.uid,
      COALESCE(dept_name, 'Department') || ': document resubmitted',
      format(
        '%s (%s) re-uploaded documents for %s. Your review is pending again.',
        COALESCE(student_name, 'Unknown'),
        COALESCE(student_code, '—'),
        COALESCE(dept_name, 'the department')
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

COMMIT;
