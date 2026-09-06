-- ============================================================================
-- v2 — Sequential clearance model (M-v2.1 ... M-v2.5)
-- Converts the 8-office parallel model to the teacher-approved 10-office
-- sequential model:
--   1 Laboratory · 2 Dept. Head · 3 Hostel Superintendent · 4 Proctor Office
--   5 Store · 6 Library · 7 Caretaker & Security Inspector · 8 Exam Section
--   9 Accounts Section · 10 Administration (final sign-off → certificate)
--
-- Changes in this file:
--   S1 (M-v2.1) Reseed the 10 offices, drop the legacy 8 rows
--   S2 (M-v2.2) Normalize program values + purge all test data
--   S3 (M-v2.3) Sequential review creation: first office on submit, next
--               office created when the active one is approved; drop the
--               head-ordering machinery (guard_head_approval_order,
--               trigger_head_review); fix handle_review_rejection's stale
--               staff_departments reference
--   S4 (M-v2.4) Gate document uploads to the currently-unlocked step
--   S5 (M-v2.5) Replace declare_departments_na(array) with
--               declare_review_na(review_id)
--
-- Apply: Supabase Dashboard → SQL Editor → new query → paste → Run
-- (equivalently: npx supabase db query --linked -f <this file>)
-- ============================================================================


-- ---------------------------------------------------------------------------
-- S2 (M-v2.2) — purge all test/legacy data FIRST so reseeding is clean.
-- The `triggered` column stays (harmless, still used by the interim UI) but
-- every review created by the sequential flow is marked triggered=true.
-- ---------------------------------------------------------------------------

TRUNCATE TABLE public.clearance_applications CASCADE;
TRUNCATE TABLE public.notifications;
TRUNCATE TABLE public.audit_log;

-- Note: orphaned files in the `clearance-docs` storage bucket are purged via
-- the Storage API (direct SQL DELETE is blocked by storage.protect_delete).

-- Normalize legacy free-text program values to the 5 canonical program codes.
UPDATE public.profiles
SET program = CASE
    WHEN btrim(program) = 'Computer Science & Engineering' THEN 'CSE'
    WHEN btrim(program) = 'CSE' THEN 'CSE'
    WHEN btrim(program) = 'Textile Engineering' THEN 'TE'
    WHEN btrim(program) = 'Industrial & Production Engineering' THEN 'IPE'
    WHEN btrim(program) = 'Fashion Design & Apparel Engineering' THEN 'FDAE'
    WHEN btrim(program) = 'Electrical & Electronic Engineering' THEN 'EEE'
    WHEN btrim(program) = 'EEE' THEN 'EEE'
    ELSE program
  END
WHERE program IS NOT NULL;


-- ---------------------------------------------------------------------------
-- S1 (M-v2.1) — reseed the 10 offices. Deleting the legacy rows cascades any
-- leftover department_reviews / registrar_departments references.
-- ---------------------------------------------------------------------------

DELETE FROM public.departments;

INSERT INTO public.departments (code, name, requirement, document_hint, sort_order, is_final_signoff) VALUES
  ('lab',       'Laboratory',                        'All lab equipment and loaned items returned; laboratory undertaking issued', 'Equipment return receipt / laboratory undertaking', 1, false),
  ('head',      'Dept. Head',                        'Program-specific sign-off; all credits complete, thesis/project submitted', 'Final marksheet / thesis approval form',             2, false),
  ('hostel',    'Hostel Superintendent',             'Hostel dues cleared, room vacated', 'Room vacate receipt / dues clearance slip',          3, false),
  ('proctor',   'Proctor Office',                    'No pending disciplinary matters; student ID card valid', 'Student ID card photo',                             4, false),
  ('store',     'Store',                             'All store items/equipment returned', 'Store return receipt',                              5, false),
  ('library',   'Library',                           'All books returned, no fines pending', 'No-dues slip (if issued on paper)',                 6, false),
  ('caretaker', 'Caretaker & Security Inspector',    'Room/facility inspection passed; gate pass settled', 'ID card photo (front and back)',                    7, false),
  ('exam',      'Exam Section',                      'Transcript/exam records verified, no pending dues', 'Final marksheet / result slip',                      8, false),
  ('accounts',  'Accounts Section',                  'All tuition fees and fines cleared', 'Final semester payment slip / bank receipt',         9, false),
  ('admin',     'Administration',                    'Final sign-off after all offices approve', 'Not required',                                      10, true);


-- ---------------------------------------------------------------------------
-- S3 (M-v2.3) — sequential review creation.
--   * create_department_reviews now creates ONLY the first office (min sort_order)
--   * trg_advance_sequential_review creates the next office when the active
--     review is approved (or N/A-declared), never more than one at a time
--   * drop the parallel-model head-ordering guards entirely
--   * fix handle_review_rejection: registrar_departments, not the stale
--     staff_departments table, and keep final-signoff escalation suppression
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_department_reviews()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.department_reviews (application_id, department_id, triggered)
  SELECT NEW.id, d.id, true
  FROM public.departments d
  WHERE d.sort_order = (SELECT MIN(sort_order) FROM public.departments)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.advance_sequential_review()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status <> 'approved' OR OLD.status IS NOT DISTINCT FROM 'approved' THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.department_reviews (application_id, department_id, triggered)
  SELECT NEW.application_id, d.id, true
  FROM public.departments d
  WHERE d.sort_order = (
    SELECT MIN(d2.sort_order)
    FROM public.departments d2
    WHERE d2.sort_order > (SELECT sort_order FROM public.departments WHERE id = NEW.department_id)
  )
  ON CONFLICT (application_id, department_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_advance_sequential_review ON public.department_reviews;
CREATE TRIGGER trg_advance_sequential_review
AFTER UPDATE OF status ON public.department_reviews
FOR EACH ROW EXECUTE FUNCTION public.advance_sequential_review();

-- Drop the 8-office parallel head-ordering + trigger machinery.
DROP TRIGGER IF EXISTS trg_guard_head_approval_order ON public.department_reviews;
DROP FUNCTION IF EXISTS public.guard_head_approval_order();

DROP TRIGGER IF EXISTS trg_trigger_head_review ON public.department_reviews;
DROP FUNCTION IF EXISTS public.trigger_head_review();

REVOKE EXECUTE ON FUNCTION public.advance_sequential_review() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_department_reviews() FROM anon, authenticated, PUBLIC;

-- Fix escalation: the watcher query must read registrar_departments (the
-- staff_departments name was renamed away long ago — this errored on escalate).
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

  -- Final-signoff office (Administration) has nowhere higher to escalate to.
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
        || NEW.attempts || ' times by ' || dept_name || '. Manual follow-up required.'
    FROM unnest(watchers) AS w;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.handle_review_rejection() FROM anon, PUBLIC;

-- Sequential-model certificate fix: guard_clearance_status (BEFORE UPDATE on
-- clearance_applications) blocks non-admin writers. In the v2 model the final
-- Administration office is approved by its own registrar (Decision #7), so the
-- certificate path must be allowed to flip status -> cleared. maybe_issue_
-- certificate sets a transaction-local flag that the guard honours.

CREATE OR REPLACE FUNCTION public.maybe_issue_certificate()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.department_reviews WHERE application_id = NEW.application_id AND status <> 'approved') = 0 THEN
    PERFORM set_config('app.cert_issuance', 'on', true);
    UPDATE public.clearance_applications
      SET status = 'cleared', cleared_at = now()
      WHERE id = NEW.application_id AND status <> 'cleared';
    INSERT INTO public.certificates (application_id, student_name, student_code, program, batch)
    SELECT
      NEW.application_id,
      COALESCE(p.full_name, 'Unknown'),
      COALESCE(p.user_code, 'Unknown'),
      p.program,
      p.batch
    FROM public.profiles p
    JOIN public.clearance_applications a ON a.id = NEW.application_id AND a.student_id = p.id
    ON CONFLICT (application_id) DO NOTHING;
    INSERT INTO public.notifications (user_id, title, body)
    SELECT a.student_id, 'Clearance complete', 'All departments have approved your clearance. Your certificate is ready to download.'
    FROM public.clearance_applications a WHERE a.id = NEW.application_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_clearance_status()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Allow if actor is admin, or the certificate-issuance flow is running.
  IF public.has_role(auth.uid(), 'admin')
     OR current_setting('app.cert_issuance', true) = 'on' THEN
    RETURN NEW;
  END IF;

  -- Allow if status and cleared_at are unchanged.
  IF NEW.status IS NOT DISTINCT FROM OLD.status
      AND NEW.cleared_at IS NOT DISTINCT FROM OLD.cleared_at THEN
    RETURN NEW;
  END IF;

  -- Block: non-admin tried to change status or cleared_at.
  RAISE EXCEPTION 'Only administrators can change clearance status';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.maybe_issue_certificate() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.guard_clearance_status() FROM anon, authenticated, PUBLIC;


-- ---------------------------------------------------------------------------
-- S4 (M-v2.4) — gate document uploads to the currently-unlocked step.
-- A review is the active upload step iff it is the earliest non-approved
-- office of the caller's application (all offices before it are approved).
-- Covers pending *and* rejected reviews, so re-uploads after rejection work
-- before the student reopens the review.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_current_upload_step(p_review_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.department_reviews r
    JOIN public.clearance_applications a ON a.id = r.application_id
    JOIN public.departments d ON d.id = r.department_id
    WHERE r.id = p_review_id
      AND a.student_id = auth.uid()
      AND r.status <> 'approved'
      AND NOT EXISTS (
        SELECT 1
        FROM public.department_reviews r2
        JOIN public.departments d2 ON d2.id = r2.department_id
        WHERE r2.application_id = a.id
          AND d2.sort_order < d.sort_order
          AND r2.status <> 'approved'
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_current_upload_step(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_current_upload_step(uuid) TO authenticated;

DROP POLICY IF EXISTS "students upload documents" ON public.documents;
CREATE POLICY "students upload documents" ON public.documents FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid() AND public.is_current_upload_step(review_id));


-- ---------------------------------------------------------------------------
-- S5 (M-v2.5) — per-office N/A declaration.
-- Replaces the bulk declare_departments_na(array) RPC (parallel-model concept).
-- Guards: caller owns the application, office is the active step, review is
-- pending, office is not the final sign-off, and no document was uploaded.
-- Approving via N/A also advances the sequence (trigger above).
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.declare_departments_na(uuid, text[]);

CREATE OR REPLACE FUNCTION public.declare_review_na(p_review_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app uuid;
  v_final boolean;
  v_status text;
BEGIN
  SELECT application_id, status INTO v_app, v_status
  FROM public.department_reviews
  WHERE id = p_review_id;

  IF v_app IS NULL THEN
    RAISE EXCEPTION 'Review not found';
  END IF;

  IF NOT public.owns_application(auth.uid(), v_app) THEN
    RAISE EXCEPTION 'Not your application';
  END IF;

  IF v_status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending reviews can be declared N/A';
  END IF;

  IF NOT public.is_current_upload_step(p_review_id) THEN
    RAISE EXCEPTION 'Only the currently active office can be declared N/A';
  END IF;

  SELECT d.is_final_signoff INTO v_final
  FROM public.departments d
  JOIN public.department_reviews r ON r.department_id = d.id
  WHERE r.id = p_review_id;

  IF v_final THEN
    RAISE EXCEPTION 'Final sign-off office cannot be declared N/A';
  END IF;

  IF EXISTS (SELECT 1 FROM public.documents doc WHERE doc.review_id = p_review_id) THEN
    RAISE EXCEPTION 'Cannot declare N/A after uploading documents';
  END IF;

  UPDATE public.department_reviews
  SET status = 'approved',
      is_na = true,
      remarks = 'Student declared N/A',
      reviewed_at = now()
  WHERE id = p_review_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.declare_review_na(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.declare_review_na(uuid) TO authenticated;


-- ---------------------------------------------------------------------------
-- VERIFY — expect departments_seeded = 10, apps_seeded = 0, final = Administration
-- ---------------------------------------------------------------------------
SELECT (SELECT count(*) FROM public.departments) AS departments_seeded,
       (SELECT count(*) FROM public.clearance_applications) AS apps_seeded,
       (SELECT name FROM public.departments WHERE is_final_signoff) AS final_office;