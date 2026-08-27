-- M14: Restrict audit_log INSERTS to registrar/admin.
--
-- The previous policy ("authenticated write audit log") allowed ANY authenticated
-- user (including students) to insert their own rows into audit_log as long as
-- actor_id = auth.uid(). audit_log is the primary accountability record for every
-- approve/reject decision, so students must not be able to forge entries.
--
-- All writers of audit_log are SECURITY DEFINER triggers (e.g. log_review_status_change),
-- so they bypass RLS and are unaffected by this restriction. Only direct client-side
-- inserts are gated to registrar/admin.

DROP POLICY IF EXISTS "authenticated write audit log" ON public.audit_log;

CREATE POLICY "registrar and admin write audit log"
  ON public.audit_log FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'registrar')
    OR public.has_role(auth.uid(), 'admin')
  );
