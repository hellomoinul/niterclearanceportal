-- Use the certificates.id (UUID) directly for QR verification instead of a separate certificate_code.
-- This saves a column, removes code-generation logic, and the UUID is already unique + unguessable (v4).

-- 1. Drop the certificate_code column (and its unique index)
ALTER TABLE public.certificates DROP COLUMN IF EXISTS certificate_code;

-- 2. Update maybe_issue_certificate() to stop generating certificate_code
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

-- 3. Update consolidated_setup.sql comment (for reference)
-- The verify route now uses /verify/{certificates.id} (UUID) instead of /verify/{certificate_code}
