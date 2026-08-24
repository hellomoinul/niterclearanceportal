-- Soft delete for notifications.
-- Adds a deleted_at timestamp column. Deleted notifications are filtered out
-- by the client query but remain in the DB for admin/audit purposes.

ALTER TABLE public.notifications
  ADD COLUMN deleted_at timestamptz DEFAULT NULL;
