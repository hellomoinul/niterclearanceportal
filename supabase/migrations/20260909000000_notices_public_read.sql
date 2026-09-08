-- Notices are maintained by admins but are public announcements: allow anyone
-- (including visitors on the home page) to read them. The existing
-- "admins manage notices" policy still governs all writes.

drop policy if exists "public read notices" on public.notices;

create policy "public read notices" on public.notices
  for select
  to anon, authenticated
  using (true);

grant select on public.notices to anon;