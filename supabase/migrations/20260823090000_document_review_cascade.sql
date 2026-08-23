-- Document status must follow the department review decision.
-- 1) Track who reviewed a document and when.
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- 2) One-time repair: documents that existed when their review was approved
--    should carry the approval instead of showing "Pending" forever.
UPDATE public.documents d
SET status = 'approved',
    reviewed_by = r.reviewed_by,
    reviewed_at = r.reviewed_at
FROM public.department_reviews r
WHERE d.review_id = r.id
  AND r.status = 'approved'
  AND d.status = 'pending'
  AND (r.reviewed_at IS NULL OR d.uploaded_at <= r.reviewed_at);

-- 3) One-time repair: for reviews currently rejected, mark the most recent
--    document as the one that caused the rejection (with the remark attached).
WITH latest AS (
  SELECT DISTINCT ON (review_id) id, review_id
  FROM public.documents
  ORDER BY review_id, uploaded_at DESC
)
UPDATE public.documents d
SET status = 'rejected',
    rejection_reason = r.remarks,
    reviewed_by = r.reviewed_by,
    reviewed_at = r.reviewed_at
FROM latest l
JOIN public.department_reviews r ON r.id = l.review_id
WHERE d.id = l.id
  AND r.status = 'rejected';

-- 4) Students cannot read staff profiles (RLS), but should still see who approved
--    their document. This RPC reveals only the display name, gated by the same
--    visibility rules as the review itself.
CREATE OR REPLACE FUNCTION public.reviewer_display_name(_review_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.full_name
  FROM public.department_reviews r
  JOIN public.profiles p ON p.id = r.reviewed_by
  WHERE r.id = _review_id
    AND (
      EXISTS (
        SELECT 1 FROM public.clearance_applications a
        WHERE a.id = r.application_id AND a.student_id = auth.uid()
      )
      OR public.staff_in_department(auth.uid(), r.department_id)
      OR public.has_role(auth.uid(), 'admin')
    )
$$;
REVOKE EXECUTE ON FUNCTION public.reviewer_display_name(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.reviewer_display_name(uuid) TO authenticated;
