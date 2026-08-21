REVOKE EXECUTE ON FUNCTION public.create_department_reviews() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.maybe_issue_certificate() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_review_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.staff_in_department(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.owns_application(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.can_see_review(uuid, uuid) FROM anon;
