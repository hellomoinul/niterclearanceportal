-- Department Head auto-trigger + final sign-off support.
--
-- Adds a `triggered` flag to department_reviews. The Head department's review is
-- created (pending) when a student applies, but it must not become actionable until
-- the student reaches 7/8 approved (all 7 non-Head offices). A `triggered` flag
-- records that moment so the student UI can show "Waiting for 7/8 approval" before
-- the trigger and the admin queue only shows Head reviews once triggered.

BEGIN;

-- 1. Add the triggered flag.
ALTER TABLE public.department_reviews
  ADD COLUMN IF NOT EXISTS triggered boolean NOT NULL DEFAULT false;

-- 2. AFTER trigger: flip the pending Head review to triggered once all 7 non-Head
--    offices have approved the same application.
CREATE OR REPLACE FUNCTION public.trigger_head_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act on transitions to approved.
  IF OLD.status IS NOT DISTINCT FROM NEW.status OR NEW.status <> 'approved' THEN
    RETURN NEW;
  END IF;

  -- If any non-Head office is still not approved, the Head review stays untriggered.
  IF EXISTS (
    SELECT 1
    FROM public.department_reviews dr
    JOIN public.departments d ON d.id = dr.department_id
    WHERE dr.application_id = NEW.application_id
      AND d.is_final_signoff = false
      AND dr.status <> 'approved'
  ) THEN
    RETURN NEW;
  END IF;

  UPDATE public.department_reviews head_r
  SET triggered = true
  FROM public.departments hd
  WHERE hd.id = head_r.department_id
    AND hd.is_final_signoff = true
    AND head_r.application_id = NEW.application_id
    AND head_r.status = 'pending'
    AND head_r.triggered = false;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trigger_head_review ON public.department_reviews;
CREATE TRIGGER trg_trigger_head_review
AFTER UPDATE OF status ON public.department_reviews
FOR EACH ROW EXECUTE FUNCTION public.trigger_head_review();

REVOKE EXECUTE ON FUNCTION public.trigger_head_review() FROM anon, PUBLIC;

-- 3. Suppress escalation for final-signoff departments: the Head is the top
--    authority, so a Head rejection has nowhere higher to escalate to. Marking the
--    Head review "escalated to Department Head" (itself) is meaningless, so keep the
--    attempts counter working but skip the escalated flag + watcher notification.
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

  -- Only escalate when the rejected office is NOT the final sign-off.
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

REVOKE EXECUTE ON FUNCTION public.handle_review_rejection() FROM anon, PUBLIC;

-- 4. Backfill: mark any already-eligible Head reviews as triggered.
UPDATE public.department_reviews head_r
SET triggered = true
FROM public.departments hd
WHERE hd.id = head_r.department_id
  AND hd.is_final_signoff = true
  AND head_r.status = 'pending'
  AND head_r.triggered = false
  AND NOT EXISTS (
    SELECT 1
    FROM public.department_reviews dr
    JOIN public.departments d ON d.id = dr.department_id
    WHERE dr.application_id = head_r.application_id
      AND d.is_final_signoff = false
      AND dr.status <> 'approved'
  );

COMMIT;
