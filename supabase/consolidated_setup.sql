-- ============================================================================
-- NITER Clearance Portal — FULL DATABASE SETUP (one paste, one click)
-- Target: brand-new Supabase project (jmpavfglhtmcraxfiock)
-- Built from the 5 migrations in supabase/migrations/ + 2 fixes:
--   * creates the `clearance-docs` storage bucket no migration ever made
--   * storage policies use owner_id (fresh projects dropped the legacy column)
-- Run: Supabase Dashboard -> SQL Editor -> New query -> paste ALL -> Run
-- ============================================================================

-- ---------------------------------------------------------------------------
-- SECTION 1 — schema, row-level security, triggers, seed data
-- ---------------------------------------------------------------------------

CREATE TYPE public.app_role AS ENUM ('student', 'registrar', 'admin');
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.application_status AS ENUM ('draft', 'in_review', 'cleared');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_code text UNIQUE NOT NULL,
  full_name text NOT NULL,
  registration_no text,
  program text,
  batch text,
  phone text,
  personal_email text,
  guardian_name text,
  guardian_phone text,
  present_address text,
  permanent_address text,
  cgpa numeric(3,2),
  credits_completed int,
  photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  requirement text,
  document_hint text,
  sort_order int NOT NULL DEFAULT 0,
  is_final_signoff boolean NOT NULL DEFAULT false
);
GRANT SELECT ON public.departments TO anon, authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "departments readable by all" ON public.departments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage departments" ON public.departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.departments (code, name, requirement, document_hint, sort_order, is_final_signoff) VALUES
  ('accounts','Accounts','All tuition fees and fines cleared','Final semester payment slip / bank receipt',1,false),
  ('admin','Admin','Administrative records settled','Any pending administrative form',2,false),
  ('coordinator','Course Coordinator','All credits complete, thesis/project submitted','Final result marksheet, thesis approval form',3,false),
  ('hostel','Hostel','Room vacated and hostel dues paid','Room vacate receipt, dues clearance slip',4,false),
  ('security','Security','ID card returned, gate pass issued','ID card photo (front and back), gate pass',5,false),
  ('library','Library','All books returned, no fines','No-dues slip (if issued on paper)',6,false),
  ('lab','Lab / Workshop','All equipment returned','Equipment return receipt',7,false),
  ('head','Department Head','Final sign-off after all offices approve','Not required',8,true);

CREATE TABLE public.registrar_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  UNIQUE (user_id, department_id)
);
GRANT SELECT ON public.registrar_departments TO authenticated;
GRANT ALL ON public.registrar_departments TO service_role;
ALTER TABLE public.registrar_departments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.registrar_in_department(_user_id uuid, _department_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.registrar_departments WHERE user_id = _user_id AND department_id = _department_id)
$$;

CREATE POLICY "registrar read own assignments" ON public.registrar_departments FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "admins manage assignments" ON public.registrar_departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "own profile readable" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'registrar'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.clearance_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.application_status NOT NULL DEFAULT 'in_review',
  thesis_title text,
  supervisor_name text,
  expected_graduation text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  cleared_at timestamptz,
  UNIQUE (student_id)
);
GRANT SELECT, INSERT, UPDATE ON public.clearance_applications TO authenticated;
GRANT ALL ON public.clearance_applications TO service_role;
ALTER TABLE public.clearance_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "students read own application" ON public.clearance_applications FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'registrar') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "students create own application" ON public.clearance_applications FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());
CREATE POLICY "students update own application" ON public.clearance_applications FOR UPDATE TO authenticated
  USING (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (student_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.department_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.clearance_applications(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  status public.review_status NOT NULL DEFAULT 'pending',
  remarks text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  attempts int NOT NULL DEFAULT 0,
  escalated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (application_id, department_id)
);
GRANT SELECT, INSERT, UPDATE ON public.department_reviews TO authenticated;
GRANT ALL ON public.department_reviews TO service_role;
ALTER TABLE public.department_reviews ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.owns_application(_user_id uuid, _application_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.clearance_applications WHERE id = _application_id AND student_id = _user_id)
$$;

CREATE POLICY "reviews readable" ON public.department_reviews FOR SELECT TO authenticated
  USING (
    public.owns_application(auth.uid(), application_id)
    OR public.registrar_in_department(auth.uid(), department_id)
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "registrar and admin update reviews" ON public.department_reviews FOR UPDATE TO authenticated
  USING (public.registrar_in_department(auth.uid(), department_id) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.registrar_in_department(auth.uid(), department_id) OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.department_reviews(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_type text,
  file_size int,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id),
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  status public.review_status NOT NULL DEFAULT 'pending',
  rejection_reason text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.can_see_review(_user_id uuid, _review_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.department_reviews r
    JOIN public.clearance_applications a ON a.id = r.application_id
    WHERE r.id = _review_id
      AND (a.student_id = _user_id
        OR public.registrar_in_department(_user_id, r.department_id)
        OR public.has_role(_user_id, 'admin'))
  )
$$;

CREATE POLICY "documents readable" ON public.documents FOR SELECT TO authenticated
  USING (public.can_see_review(auth.uid(), review_id));
CREATE POLICY "students upload documents" ON public.documents FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid() AND public.can_see_review(auth.uid(), review_id));
CREATE POLICY "documents update" ON public.documents FOR UPDATE TO authenticated
  USING (public.can_see_review(auth.uid(), review_id))
  WITH CHECK (public.can_see_review(auth.uid(), review_id));
CREATE POLICY "students delete own documents" ON public.documents FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid());

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id),
  actor_name text,
  action text NOT NULL,
  entity text,
  entity_id uuid,
  details text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read audit log" ON public.audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "authenticated write audit log" ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL UNIQUE REFERENCES public.clearance_applications(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  student_code text NOT NULL,
  program text,
  batch text,
  issued_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.certificates TO anon, authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "certificates publicly verifiable" ON public.certificates FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.create_department_reviews()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.department_reviews (application_id, department_id)
  SELECT NEW.id, d.id FROM public.departments d
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_create_department_reviews
AFTER INSERT ON public.clearance_applications
FOR EACH ROW EXECUTE FUNCTION public.create_department_reviews();

CREATE OR REPLACE FUNCTION public.maybe_issue_certificate()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pending_count int;
  app public.clearance_applications;
  prof public.profiles;
BEGIN
  SELECT count(*) INTO pending_count FROM public.department_reviews
  WHERE application_id = NEW.application_id AND status <> 'approved';

  IF pending_count = 0 THEN
    SELECT * INTO app FROM public.clearance_applications WHERE id = NEW.application_id;
    SELECT * INTO prof FROM public.profiles WHERE id = app.student_id;
    UPDATE public.clearance_applications
      SET status = 'cleared', cleared_at = now() WHERE id = NEW.application_id AND status <> 'cleared';
    INSERT INTO public.certificates (application_id, student_name, student_code, program, batch)
    VALUES (
      NEW.application_id,
      COALESCE(prof.full_name, 'Unknown'),
      COALESCE(prof.user_code, 'Unknown'),
      prof.program,
      prof.batch
    ) ON CONFLICT (application_id) DO NOTHING;

    INSERT INTO public.notifications (user_id, title, body)
    VALUES (app.student_id, 'Clearance complete', 'All departments have approved your clearance. Your certificate is ready to download.');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_maybe_issue_certificate
AFTER UPDATE OF status ON public.department_reviews
FOR EACH ROW WHEN (NEW.status = 'approved')
EXECUTE FUNCTION public.maybe_issue_certificate();

CREATE OR REPLACE FUNCTION public.notify_review_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  sid uuid;
  dname text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT student_id INTO sid FROM public.clearance_applications WHERE id = NEW.application_id;
    SELECT name INTO dname FROM public.departments WHERE id = NEW.department_id;
    INSERT INTO public.notifications (user_id, title, body)
    VALUES (sid, dname || ': ' || NEW.status, COALESCE(NEW.remarks, 'Status updated by ' || dname || '.'));
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_notify_review_change
AFTER UPDATE OF status ON public.department_reviews
FOR EACH ROW EXECUTE FUNCTION public.notify_review_change();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Storage bucket (was never created by any Lovable migration!)
INSERT INTO storage.buckets (id, name, public)
VALUES ('clearance-docs', 'clearance-docs', false)
ON CONFLICT (id) DO NOTHING;

-- owner_id is the modern column; fresh projects no longer have the legacy one
CREATE POLICY "students manage own clearance docs" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'clearance-docs' AND owner_id = auth.uid()::text)
  WITH CHECK (bucket_id = 'clearance-docs' AND owner_id = auth.uid()::text);
CREATE POLICY "registrar read clearance docs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'clearance-docs' AND (public.has_role(auth.uid(), 'registrar') OR public.has_role(auth.uid(), 'admin')));

-- ---------------------------------------------------------------------------
-- SECTION 2 — lock down trigger/helper functions
-- ---------------------------------------------------------------------------

REVOKE EXECUTE ON FUNCTION public.create_department_reviews() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.maybe_issue_certificate() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_review_change() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.registrar_in_department(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.owns_application(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_see_review(uuid, uuid) FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_in_department(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_application(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_see_review(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- SECTION 3 — role self-service + admin role management
-- ---------------------------------------------------------------------------

CREATE POLICY "self assign student role" ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'student');
GRANT INSERT ON public.user_roles TO authenticated;
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT UPDATE, DELETE ON public.user_roles TO authenticated;

-- ---------------------------------------------------------------------------
-- SECTION 4 — escalation counting + audit logging
-- ---------------------------------------------------------------------------

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
BEGIN
  IF NEW.status <> 'rejected' OR OLD.status IS NOT DISTINCT FROM 'rejected' THEN
    RETURN NEW;
  END IF;

  NEW.attempts := OLD.attempts + 1;

  IF NEW.attempts < 3 THEN
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
    SELECT sd.user_id
    FROM public.registrar_departments sd
    JOIN public.departments d ON d.id = sd.department_id
    WHERE d.is_final_signoff AND sd.user_id <> auth.uid()
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

CREATE OR REPLACE FUNCTION public.log_review_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid := auth.uid();
  actor_name text;
  dept_name text;
  student_code text;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO actor_name FROM public.profiles WHERE id = actor;

  SELECT d.name INTO dept_name FROM public.departments d WHERE d.id = NEW.department_id;

  SELECT p.user_code INTO student_code
  FROM public.clearance_applications a
  JOIN public.profiles p ON p.id = a.student_id
  WHERE a.id = NEW.application_id;

  INSERT INTO public.audit_log (actor_id, actor_name, action, entity, entity_id, details)
  VALUES (
    actor,
    coalesce(actor_name, 'system'),
    'review_' || NEW.status,
    'department_review',
    NEW.id,
    concat_ws(
      ' · ',
      dept_name,
      student_code,
      CASE WHEN NEW.remarks IS NOT NULL AND NEW.remarks <> '' THEN 'remark: ' || NEW.remarks END
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_review_rejection ON public.department_reviews;
CREATE TRIGGER trg_review_rejection
BEFORE UPDATE OF status ON public.department_reviews
FOR EACH ROW EXECUTE FUNCTION public.handle_review_rejection();

DROP TRIGGER IF EXISTS trg_review_audit ON public.department_reviews;
CREATE TRIGGER trg_review_audit
AFTER UPDATE OF status ON public.department_reviews
FOR EACH ROW EXECUTE FUNCTION public.log_review_status_change();

REVOKE EXECUTE ON FUNCTION public.handle_review_rejection() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_review_status_change() FROM anon, PUBLIC;

-- ---------------------------------------------------------------------------
-- VERIFY — should print departments_seeded = 8 and documents_bucket = t
-- ---------------------------------------------------------------------------
SELECT (SELECT count(*) FROM public.departments) AS departments_seeded,
       (SELECT count(*) FROM pg_policies WHERE schemaname = 'public') AS policies_created,
       (SELECT coalesce(public, false) = false FROM storage.buckets WHERE id = 'clearance-docs') AS documents_bucket;
