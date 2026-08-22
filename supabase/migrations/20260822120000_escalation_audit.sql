-- Escalation counting, department-head alerts and audit logging for review decisions.

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
    FROM public.staff_departments sd
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
