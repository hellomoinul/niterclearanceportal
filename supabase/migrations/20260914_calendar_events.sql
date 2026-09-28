-- ============================================================================
-- M-v3.4 — Calendar events backend (expert review item)
--
-- Backend for the public calendar (F-v3.1) and the admin Calendar CRUD
-- (S-v2.16). Mirrors the notices model: public read for everyone (including
-- anon visitors on the calendar route), admin-only write.
--
--   calendar_events:
--     id              uuid PK
--     title           text NOT NULL
--     description     text
--     event_type      text            (e.g. 'academic', 'holiday', 'exam', ...)
--     start_date      date NOT NULL
--     end_date        date NOT NULL    (same day for single-day events)
--     target_audience text NOT NULL    (structured: 'all' | student | office code | batch)
--     created_by      uuid -> profiles (admin who created it)
--     created_at      timestamptz
--
-- RLS: SELECT to anon + authenticated; INSERT/UPDATE/DELETE admin only.
-- Apply: Supabase Dashboard -> SQL Editor -> new query -> paste -> Run
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.calendar_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  description     text,
  event_type      text,
  start_date      date NOT NULL,
  end_date        date NOT NULL,
  target_audience text NOT NULL DEFAULT 'all',
  created_by      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT calendar_events_end_not_before_start CHECK (end_date >= start_date)
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calendar public read" ON public.calendar_events;
CREATE POLICY "calendar public read" ON public.calendar_events
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admins manage calendar events" ON public.calendar_events;
CREATE POLICY "admins manage calendar events" ON public.calendar_events
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON public.calendar_events FROM anon, PUBLIC;
GRANT SELECT ON public.calendar_events TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.calendar_events TO authenticated;