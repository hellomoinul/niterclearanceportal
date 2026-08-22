-- Quick patch: recreate the AFTER triggers that notify students + write audit_log.
-- The BEFORE trigger (attempts counter) works; these two may have failed during
-- the initial consolidated run. Safe to run multiple times.

CREATE OR REPLACE FUNCTION public.notify_review_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

DROP TRIGGER IF EXISTS trg_notify_review_change ON public.department_reviews;
CREATE TRIGGER trg_notify_review_change
AFTER UPDATE OF status ON public.department_reviews
FOR EACH ROW EXECUTE FUNCTION public.notify_review_change();

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
  SELECT name INTO dept_name FROM public.departments d WHERE d.id = NEW.department_id;
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

DROP TRIGGER IF EXISTS trg_review_audit ON public.department_reviews;
CREATE TRIGGER trg_review_audit
AFTER UPDATE OF status ON public.department_reviews
FOR EACH ROW EXECUTE FUNCTION public.log_review_status_change();
