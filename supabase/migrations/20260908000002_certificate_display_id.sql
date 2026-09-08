-- ============================================================================
-- M-v2.8a — Display-only certificate ID (review item 4b, middle-ground)
--
-- The certificate ID printed on the certificate / verify page is the certificate
-- UUID itself (what the QR encodes). To make manual verification practical, a
-- display-only prefix (NCP-<first 8 hex of the UUID>) is derived in the
-- frontend with formatCertificateId() — no new column, single source of truth.
--
-- So that the printed code is actually typeable, this adds a small SECURITY
-- DEFINER resolver accepting BOTH:
--   * a full 36-char UUID  (what the QR encodes)
--   * the display code     ("NCP-xxxxxxxx" or bare 8-hex prefix)
-- and returning the matching certificate UUID (or NULL). No schema change:
-- only a function + grants.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.resolve_certificate_id(p_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text := lower(trim(p_code));
  v_id uuid;
BEGIN
  IF v_code IS NULL OR v_code = '' THEN
    RETURN NULL;
  END IF;

  -- Strip the optional display prefix ("ncp-xxxxxxxx" -> "xxxxxxxx").
  IF left(v_code, 4) = 'ncp-' THEN
    v_code := substring(v_code from 5);
  END IF;

  IF v_code ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    -- Full UUID form (QR).
    SELECT id INTO v_id FROM public.certificates WHERE id::text = v_code;
  ELSIF v_code ~ '^[0-9a-f]{8}$' THEN
    -- Display-prefix form: first 8 hex chars of the UUID.
    SELECT id INTO v_id FROM public.certificates WHERE id::text LIKE v_code || '%';
  END IF;

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.resolve_certificate_id(text) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_certificate_id(text) TO anon;
GRANT EXECUTE ON FUNCTION public.resolve_certificate_id(text) TO authenticated;