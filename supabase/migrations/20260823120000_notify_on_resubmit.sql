-- Notify department staff + admins when a rejected student resubmits documents.
-- Trigger fires only on the rejected -> pending transition (one per rejection cycle).

CREATE OR REPLACE FUNCTION public.notify_on_resubmit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  student_name text;
  student_code text;
  dept_name text;
  recipient record;
BEGIN
  SELECT full_name, user_code INTO student_name, student_code
  FROM public.profiles WHERE id = (
    SELECT student_id FROM public.clearance_applications WHERE id = NEW.application_id
  );

  SELECT name INTO dept_name FROM public.departments WHERE id = NEW.department_id;

  FOR recipient IN
    SELECT sd.user_id AS uid
      FROM public.staff_departments sd
      WHERE sd.department_id = NEW.department_id
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

CREATE TRIGGER trg_notify_on_resubmit
AFTER UPDATE ON public.department_reviews
FOR EACH ROW
WHEN (OLD.status = 'rejected' AND NEW.status = 'pending')
EXECUTE FUNCTION public.notify_on_resubmit();

REVOKE EXECUTE ON FUNCTION public.notify_on_resubmit() FROM anon, authenticated, PUBLIC;
