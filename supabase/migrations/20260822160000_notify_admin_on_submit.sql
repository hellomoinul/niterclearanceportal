-- Notify admin(s) when a student submits a new clearance application.
-- Triggered AFTER INSERT on clearance_applications.

CREATE OR REPLACE FUNCTION public.notify_admin_on_application()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  student_name text;
  student_code text;
  program_name text;
  batch_name text;
  admin_row record;
BEGIN
  SELECT full_name, user_code, program, batch
    INTO student_name, student_code, program_name, batch_name
  FROM public.profiles
  WHERE id = NEW.student_id;

  FOR admin_row IN
    SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, body)
    VALUES (
      admin_row.user_id,
      'New clearance application submitted',
      format(
        '%s (%s) from %s batch %s has submitted a clearance application for review.',
        COALESCE(student_name, 'Unknown'),
        COALESCE(student_code, '—'),
        COALESCE(program_name, '—'),
        COALESCE(batch_name, '—')
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_admin_on_application
AFTER INSERT ON public.clearance_applications
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_on_application();

REVOKE EXECUTE ON FUNCTION public.notify_admin_on_application() FROM anon, authenticated, PUBLIC;
