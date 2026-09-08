-- ============================================================================
-- Rename role narrator 'registrar' -> 'office' (full sweep)
-- Option A of the role-naming decision: the role is Student / Office / Admin.
--   * ALTER TYPE app_role RENAME VALUE 'registrar' TO 'office'
--   * registrar_departments           -> office_departments
--   * registrar_in_department(uuid,u) -> office_in_department(uuid,u)
--   * notify_registrars_on_review     -> notify_offices_on_review
--   * recreate every RLS policy carrying the old literal / old names
--   * update SECURITY DEFINER function bodies that reference the old names
--
-- Behaviour note: office_in_department is BINDINGS-ONLY. The old Accounts
-- hard-rule (any staff always counts as assigned to Accounts) came from the
-- 8-office model and contradicts the v2 rule "one staff account is bound to
-- exactly one of the 10 offices" (AGENTS.md). Since user_roles/office_departments
-- are empty and bindings are being re-applied fresh, the hard-rule is dropped.
--
-- Idempotent-ish: drop-if-exists and guard blocks, safe to re-paste.
-- Apply: Supabase Dashboard -> SQL Editor -> new query -> paste ALL -> Run
-- ============================================================================

BEGIN;

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. Rename the enum value (guarded so re-runs are safe)
-- ──────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
      SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'app_role' AND e.enumlabel = 'registrar'
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'app_role' AND e.enumlabel = 'office'
    ) THEN
    ALTER TYPE public.app_role RENAME VALUE 'registrar' TO 'office';
  END IF;
END $$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. Rename the table
-- ──────────────────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.registrar_departments RENAME TO office_departments;

-- ──────────────────────────────────────────────────────────────────────────────
-- 3. Drop policies that mention the old literal / old table / old function
--    (drop both the staff-era and registrar-era names defensively)
-- ──────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "staff read own assignments"    ON public.office_departments;
DROP POLICY IF EXISTS "registrar read own assignments" ON public.office_departments;
DROP POLICY IF EXISTS "admins manage assignments"      ON public.office_departments;

DROP POLICY IF EXISTS "reviews readable"                  ON public.department_reviews;
DROP POLICY IF EXISTS "staff and admin update reviews"    ON public.department_reviews;
DROP POLICY IF EXISTS "registrar and admin update reviews" ON public.department_reviews;

DROP POLICY IF EXISTS "staff read clearance docs"    ON storage.objects;
DROP POLICY IF EXISTS "registrar read clearance docs" ON storage.objects;
DROP POLICY IF EXISTS "office read clearance docs"   ON storage.objects;

DROP POLICY IF EXISTS "own profile readable"         ON public.profiles;
DROP POLICY IF EXISTS "students read own application" ON public.clearance_applications;

DROP POLICY IF EXISTS "registrar and admin write audit log" ON public.audit_log;
DROP POLICY IF EXISTS "office and admin write audit log"    ON public.audit_log;

-- ──────────────────────────────────────────────────────────────────────────────
-- 4. Rename registrar_in_department -> office_in_department (guarded)
-- ──────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'registrar_in_department'
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = 'office_in_department'
    ) THEN
    ALTER FUNCTION public.registrar_in_department(uuid, uuid)
      RENAME TO office_in_department;
  END IF;
END $$;

-- Bindings-only definition (Accounts hard-rule from the 8-office model removed).
CREATE OR REPLACE FUNCTION public.office_in_department(_user_id uuid, _department_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.office_departments
    WHERE user_id = _user_id AND department_id = _department_id
  )
$$;

REVOKE EXECUTE ON FUNCTION public.office_in_department(uuid, uuid) FROM anon, PUBLIC;
GRANT  EXECUTE ON FUNCTION public.office_in_department(uuid, uuid) TO authenticated;

-- ──────────────────────────────────────────────────────────────────────────────
-- 5. Recreate policies with the office naming
-- ──────────────────────────────────────────────────────────────────────────────
CREATE POLICY "office read own assignments"
  ON public.office_departments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "admins manage assignments"
  ON public.office_departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "own profile readable"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'office')
  );

CREATE POLICY "students read own application"
  ON public.clearance_applications FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR public.has_role(auth.uid(), 'office')
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "reviews readable"
  ON public.department_reviews FOR SELECT TO authenticated
  USING (
    public.owns_application(auth.uid(), application_id)
    OR public.office_in_department(auth.uid(), department_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "office and admin update reviews"
  ON public.department_reviews FOR UPDATE TO authenticated
  USING (public.office_in_department(auth.uid(), department_id) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.office_in_department(auth.uid(), department_id) OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "office read clearance docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'clearance-docs'
    AND (public.has_role(auth.uid(), 'office') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "office and admin write audit log"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'office')
    OR public.has_role(auth.uid(), 'admin')
  );

-- ──────────────────────────────────────────────────────────────────────────────
-- 6. SECURITY DEFINER helpers that referenced the old function
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.can_see_review(_user_id uuid, _review_id uuid)
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
        OR public.office_in_department(_user_id, r.department_id)
        OR public.has_role(_user_id, 'admin'))
  )
$$;

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
      OR public.office_in_department(auth.uid(), r.department_id)
      OR public.has_role(auth.uid(), 'admin')
    )
$$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 7. N/A rollback RPC (reopen_na_review)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reopen_na_review(p_review_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_app uuid;
  v_dept uuid;
  v_na boolean;
  v_status text;
BEGIN
  SELECT application_id, department_id, is_na, status
    INTO v_app, v_dept, v_na, v_status
  FROM public.department_reviews
  WHERE id = p_review_id;

  IF v_app IS NULL THEN
    RAISE EXCEPTION 'Review not found';
  END IF;

  IF NOT (v_na AND v_status = 'approved') THEN
    RAISE EXCEPTION 'Only an N/A-approved review can be reverted';
  END IF;

  IF NOT (public.has_role(auth.uid(), 'admin')
          OR public.office_in_department(auth.uid(), v_dept)
          OR public.owns_application(auth.uid(), v_app)) THEN
    RAISE EXCEPTION 'Not permitted to revert this review';
  END IF;

  IF EXISTS (SELECT 1 FROM public.documents doc WHERE doc.review_id = p_review_id) THEN
    RAISE EXCEPTION 'Cannot revert an N/A review that already has documents';
  END IF;

  UPDATE public.department_reviews
  SET is_na = false,
      status = 'pending',
      remarks = NULL,
      reviewed_by = NULL,
      reviewed_at = NULL
  WHERE id = p_review_id;
END;
$fn$;

-- ──────────────────────────────────────────────────────────────────────────────
-- 8. Escalation + notification triggers that referenced the old table
-- ──────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_review_rejection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  watchers uuid[];
  dept_name text;
  student_label text;
  is_final boolean;
BEGIN
  IF NEW.status <> 'rejected' OR OLD.status IS NOT DISTINCT FROM 'rejected' THEN
    RETURN NEW;
  END IF;

  NEW.attempts := OLD.attempts + 1;

  IF NEW.attempts < 3 THEN
    RETURN NEW;
  END IF;

  SELECT d.is_final_signoff INTO is_final
  FROM public.departments d WHERE d.id = NEW.department_id;

  IF is_final THEN
    RETURN NEW;
  END IF;

  NEW.escalated := true;

  SELECT d.name INTO dept_name FROM public.departments d WHERE d.id = NEW.department_id;

  SELECT p.user_code || ' · ' || p.full_name INTO student_label
  FROM public.clearance_applications a
  JOIN public.profiles p ON p.id = a.student_id
  WHERE a.id = NEW.application_id;

  SELECT coalesce(array_agg(t.user_id), '{}') INTO watchers
  FROM (
    SELECT od.user_id
    FROM public.office_departments od
    JOIN public.departments d ON d.id = od.department_id
    WHERE d.is_final_signoff AND od.user_id <> auth.uid()
    UNION
    SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'admin'
  ) AS t;

  IF cardinality(watchers) > 0 THEN
    INSERT INTO public.notifications (user_id, title, body)
    SELECT w,
      'Escalation: ' || dept_name,
      'Student ' || coalesce(student_label, 'unknown') || ' has been rejected '
        || NEW.attempts || ' times by ' || dept_name || '. Manual follow-up required.'
    FROM unnest(watchers) AS w;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_registrars_on_review ON public.department_reviews;
DROP TRIGGER IF EXISTS trg_notify_offices_on_review   ON public.department_reviews;
DROP FUNCTION IF EXISTS public.notify_registrars_on_review();

CREATE OR REPLACE FUNCTION public.notify_offices_on_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_name text;
  student_code text;
  dept_name    text;
  office_row record;
BEGIN
  SELECT full_name, user_code INTO student_name, student_code
  FROM public.profiles WHERE id = (
    SELECT student_id FROM public.clearance_applications WHERE id = NEW.application_id
  );

  SELECT name INTO dept_name FROM public.departments WHERE id = NEW.department_id;

  FOR office_row IN
    SELECT od.user_id
    FROM public.office_departments od
    WHERE od.department_id = NEW.department_id
  LOOP
    INSERT INTO public.notifications (user_id, title, body)
    VALUES (
      office_row.user_id,
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

CREATE TRIGGER trg_notify_offices_on_review
AFTER INSERT ON public.department_reviews
FOR EACH ROW
EXECUTE FUNCTION public.notify_offices_on_review();

REVOKE EXECUTE ON FUNCTION public.notify_offices_on_review() FROM anon, authenticated, PUBLIC;

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
    SELECT od.user_id AS uid
      FROM public.office_departments od
      WHERE od.department_id = NEW.department_id
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

-- ──────────────────────────────────────────────────────────────────────────────
-- 9. Drop any leftover old function after everything is re-pointed
-- ──────────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.registrar_in_department(uuid, uuid);

-- ──────────────────────────────────────────────────────────────────────────────
-- VERIFY — expect office_role = 'office', assignments_table = 'office_departments'
-- ──────────────────────────────────────────────────────────────────────────────
SELECT string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) AS app_role
FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
WHERE t.typname = 'app_role';
SELECT EXISTS (
  SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'office_departments'
) AS office_departments_table;

COMMIT;