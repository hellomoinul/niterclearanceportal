-- ============================================================================
-- Fix office notifications: notify the correct office when their review is triggered
-- Instead of notifying admin on application submit, notify office staff when
-- their department review becomes active (triggered=true)
-- ============================================================================

-- 1. Drop the old admin notification trigger
DROP TRIGGER IF EXISTS trg_notify_admin_on_application ON public.clearance_applications;
DROP FUNCTION IF EXISTS public.notify_admin_on_application();

-- 2. Create email queue table for reliable delivery
CREATE TABLE IF NOT EXISTS public.email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  recipient_name text,
  subject text NOT NULL,
  html_body text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue (status, created_at);
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role full access" ON public.email_queue FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. Function to queue email for office staff when a review is triggered
CREATE OR REPLACE FUNCTION public.queue_office_notification(
  p_department_id uuid,
  p_application_id uuid,
  p_student_name text,
  p_student_code text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  office_record record;
  student_label text;
  dept_name text;
BEGIN
  -- Get department name
  SELECT name INTO dept_name FROM public.departments WHERE id = p_department_id;

  -- Build student label
  student_label := COALESCE(p_student_name, 'Unknown') || ' (' || COALESCE(p_student_code, '—') || ')';

  -- Find all office staff assigned to this department
  FOR office_record IN
    SELECT p.id AS user_id, p.personal_email, p.full_name, p.user_code
    FROM public.office_departments od
    JOIN public.profiles p ON p.id = od.user_id
    WHERE od.department_id = p_department_id
      AND p.personal_email IS NOT NULL
      AND p.personal_email ~* '^[^@]+@[^@]+\.[^@]+$'
  LOOP
    INSERT INTO public.email_queue (recipient_email, recipient_name, subject, html_body)
    VALUES (
      office_record.personal_email,
      office_record.full_name || ' (' || office_record.user_code || ')',
      'New clearance application requires your review',
      format(
        '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">' ||
        '<h2 style="color: #1C364E; font-family: Georgia, serif;">NITER Clearance Portal</h2>' ||
        '<p><strong>Intended for:</strong> %s <%s></p>' ||
        '<p><strong>New clearance application for review</strong></p>' ||
        '<p>%s has submitted a clearance application. The %s office is now active and awaiting your review.</p>' ||
        '<p>Please log in to the portal to review the application and uploaded documents.</p>' ||
        '<hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />' ||
        '<p style="font-size: 12px; color: #888;">' ||
        'This is an automated message from the NITER Clearance Portal. Do not reply to this email.' ||
        '</p>' ||
        '</div>',
        office_record.full_name || ' (' || office_record.user_code || ')',
        office_record.personal_email,
        p_student_name,
        dept_name
      )
    );
  END LOOP;
END;
$$;

-- 4. Trigger function: queue emails when a department review is created with triggered=true
CREATE OR REPLACE FUNCTION public.queue_office_notification_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_name text;
  student_code text;
BEGIN
  -- Only queue notification when triggered is set to true (new active review)
  IF NEW.triggered IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  -- Get student info
  SELECT p.full_name, p.user_code
    INTO student_name, student_code
  FROM public.clearance_applications a
  JOIN public.profiles p ON p.id = a.student_id
  WHERE a.id = NEW.application_id;

  -- Queue notification for office staff
  PERFORM public.queue_office_notification(
    NEW.department_id,
    NEW.application_id,
    COALESCE(student_name, 'Unknown'),
    COALESCE(student_code, '—')
  );

  RETURN NEW;
END;
$$;

-- 5. Trigger: fire when a department review is inserted with triggered=true
DROP TRIGGER IF EXISTS trg_queue_office_notification ON public.department_reviews;
CREATE TRIGGER trg_queue_office_notification
AFTER INSERT ON public.department_reviews
FOR EACH ROW
WHEN (NEW.triggered = true)
EXECUTE FUNCTION public.queue_office_notification_on_review();

-- 6. Also handle the case where advance_sequential_review sets triggered=true on INSERT
-- The advance_sequential_review function does an INSERT, so the above trigger covers it.

-- 7. Grant execute permissions
REVOKE EXECUTE ON FUNCTION public.queue_office_notification() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.queue_office_notification_on_review() FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.queue_office_notification() TO service_role;
GRANT EXECUTE ON FUNCTION public.queue_office_notification_on_review() TO service_role;

-- 8. Grant service role access to email_queue
GRANT ALL ON public.email_queue TO service_role;