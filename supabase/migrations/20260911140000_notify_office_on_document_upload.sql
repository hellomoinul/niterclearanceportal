-- FIX: Move office notification from review-open to document-upload.
-- The previous trigger (trg_notify_offices_on_review) fired the moment
-- a review row was created by advance_sequential_review (previous office
-- approval), BEFORE any document reached the new office.
-- Similarly, trg_notify_on_resubmit fired on the status change itself,
-- also before any re-upload.
--
-- This migration:
-- 1. Drops the premature review-OPEN notification trigger
-- 2. Drops the premature resubmit notification trigger
-- 3. Adds a new trigger on documents INSERT that notifies the office
--    when a document is actually uploaded for their review
-- 4. Soft-deletes stale office notifications

-- 1. Drop premature review-open notification (trigger first, then function)
DROP TRIGGER IF EXISTS trg_notify_offices_on_review ON public.department_reviews;
DROP FUNCTION IF EXISTS public.notify_offices_on_review();

-- 2. Drop premature resubmit notification (trigger first, then function)
DROP TRIGGER IF EXISTS trg_notify_on_resubmit ON public.department_reviews;
DROP FUNCTION IF EXISTS public.notify_on_resubmit();

-- 3. New: notify office on ACTUAL document upload
CREATE OR REPLACE FUNCTION public.notify_office_on_document_upload()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  student_name text;
  student_code text;
  dept_name    text;
  office_row   record;
BEGIN
  SELECT full_name, user_code INTO student_name, student_code
  FROM public.profiles WHERE id = (
    SELECT student_id FROM public.clearance_applications
    WHERE id = (SELECT application_id FROM public.department_reviews WHERE id = NEW.review_id)
  );

  SELECT name INTO dept_name
  FROM public.departments
  WHERE id = (SELECT department_id FROM public.department_reviews WHERE id = NEW.review_id);

  FOR office_row IN
    SELECT od.user_id
    FROM public.office_departments od
    JOIN public.department_reviews dr ON dr.department_id = od.department_id
    WHERE dr.id = NEW.review_id
  LOOP
    INSERT INTO public.notifications (user_id, title, body)
    VALUES (
      office_row.user_id,
      COALESCE(dept_name, 'Department') || ': new document uploaded',
      format(
        '%s (%s) uploaded a document for %s. Your review is pending.',
        COALESCE(student_name, 'Unknown'),
        COALESCE(student_code, '—'),
        COALESCE(dept_name, 'the department')
      )
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_office_on_document_upload
  AFTER INSERT ON public.documents FOR EACH ROW
  EXECUTE FUNCTION public.notify_office_on_document_upload();

REVOKE EXECUTE ON FUNCTION public.notify_office_on_document_upload()
  FROM anon, authenticated, PUBLIC;

-- 4. Cleanup: soft-delete all stale "new clearance request" office notifications
UPDATE public.notifications n
SET deleted_at = now()
WHERE n.title LIKE '%: new clearance request%'
  AND n.user_id IN (SELECT user_id FROM public.user_roles WHERE role = 'office')
  AND n.deleted_at IS NULL;
