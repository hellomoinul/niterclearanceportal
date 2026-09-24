-- ============================================================================
-- M-v3.3 — Signature snapshot data model (expert review item)
--
-- Certificates must keep the registrar signature that was active when the
-- certificate was issued, not a live pointer that later replacements would
-- change. Backend pieces:
--
--   1) signatures table (id, storage_path, uploaded_by, created_at, active)
--      + Supabase Storage bucket 'signatures' (public read; write = admin).
--   2) certificates.signature_id  -> signatures.id, set at issuance time by
--      maybe_issue_certificate() from the active signature at that moment,
--      so re-verifying an old certificate still shows that year's registrar.
--   3) RLS : any authenticated/anon may read signature rows (needed to render
--      the image on a certificate), only admins may write.
--
-- The 'active' flag supports "one active signature" semantics without a
-- uniqueness constraint on the column (a replace flow needs a brief window
-- where deactivating the old and activating the new happens across two rows).
-- Apply: Supabase Dashboard -> SQL Editor -> new query -> paste -> Run
-- ============================================================================

-- 1a) Metadata table
CREATE TABLE IF NOT EXISTS public.signatures (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL,
  uploaded_by  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  active       boolean NOT NULL DEFAULT false
);

ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "signatures readable by all" ON public.signatures;
CREATE POLICY "signatures readable by all" ON public.signatures
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admins manage signatures" ON public.signatures;
CREATE POLICY "admins manage signatures" ON public.signatures
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON public.signatures FROM anon, PUBLIC;
GRANT SELECT ON public.signatures TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.signatures TO authenticated;

-- 1b) Storage bucket for the signature images (public so certificate pages and
--     PDFs can render them without auth).
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "public read signature images"     ON storage.objects;
DROP POLICY IF EXISTS "admins manage signature images"   ON storage.objects;

CREATE POLICY "public read signature images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'signatures');

-- Admins can upload/replace/delete signature files. owner_id is the modern
-- column (fresh Supabase projects dropped the legacy "owner" column).
CREATE POLICY "admins manage signature images" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'signatures' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'signatures' AND public.has_role(auth.uid(), 'admin'));

-- 2) Snapshot FK on certificates (nice -> signatures, certificates survive).
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS signature_id uuid REFERENCES public.signatures(id);

-- 3) Capture the active signature at issuance time. Replaces the function
--    body; the trigger (trg_maybe_issue_certificate) already fires on
--    status -> approved and is unchanged.
CREATE OR REPLACE FUNCTION public.maybe_issue_certificate()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.department_reviews WHERE application_id = NEW.application_id AND status <> 'approved') = 0 THEN
    PERFORM set_config('app.cert_issuance', 'on', true);
    UPDATE public.clearance_applications
      SET status = 'cleared', cleared_at = now()
      WHERE id = NEW.application_id AND status <> 'cleared';
    INSERT INTO public.certificates (application_id, student_name, student_code, program, batch, signature_id)
    SELECT
      NEW.application_id,
      COALESCE(p.full_name, 'Unknown'),
      COALESCE(p.user_code, 'Unknown'),
      p.program,
      p.batch,
      (SELECT s.id FROM public.signatures s WHERE s.active ORDER BY s.created_at DESC LIMIT 1)
    FROM public.profiles p
    JOIN public.clearance_applications a ON a.id = NEW.application_id AND a.student_id = p.id
    ON CONFLICT (application_id) DO NOTHING;
    INSERT INTO public.notifications (user_id, title, body)
    SELECT a.student_id, 'Clearance complete', 'All departments have approved your clearance. Your certificate is ready to download.'
    FROM public.clearance_applications a WHERE a.id = NEW.application_id;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.maybe_issue_certificate() FROM anon, authenticated, PUBLIC;