-- Notify staff of a department when a new review is created for their department.
-- This fires when create_department_reviews() inserts rows for a new application.

CREATE OR REPLACE FUNCTION public.notify_staff_on_review()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  student_name text;
  student_code text;
  dept_name text;
  staff_row record;
BEGIN
  SELECT full_name, user_code INTO student_name, student_code
  FROM public.profiles WHERE id = (
    SELECT student_id FROM public.clearance_applications WHERE id = NEW.application_id
  );

  SELECT name INTO dept_name FROM public.departments WHERE id = NEW.department_id;

  FOR staff_row IN
    SELECT sd.user_id
    FROM public.staff_departments sd
    WHERE sd.department_id = NEW.department_id
  LOOP
    INSERT INTO public.notifications (user_id, title, body)
    VALUES (
      staff_row.user_id,
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

CREATE TRIGGER trg_notify_staff_on_review
AFTER INSERT ON public.department_reviews
FOR EACH ROW
EXECUTE FUNCTION public.notify_staff_on_review();

REVOKE EXECUTE ON FUNCTION public.notify_staff_on_review() FROM anon, authenticated, PUBLIC;
