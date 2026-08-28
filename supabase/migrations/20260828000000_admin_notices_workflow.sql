-- Migration: admin notices + workflow configuration tables
-- Created for Shafin admin panel lift (S11/S7). Enables notices.tsx and workflow.tsx.
-- Applied to live on 2026-08-28 via Supabase Dashboard SQL Editor.

---------------------------------------------------------------------------
-- SECTION 1 — notices (Notice Board Management, S11)
---------------------------------------------------------------------------
create table if not exists public.notices (
  id              uuid         primary key default gen_random_uuid(),
  title           text         not null,
  content         text         not null,
  target_audience text         not null default 'All',
  created_at      timestamptz  not null default now()
);

grant select, insert, update, delete on public.notices to authenticated;
grant all on public.notices to service_role;

alter table public.notices enable row level security;

-- only admins can read/create/delete notices
create policy "admins manage notices" on public.notices
  for all to authenticated
  using (
    (select role from public.user_roles where user_id = auth.uid() and role = 'admin') is not null
  )
  with check (
    (select role from public.user_roles where user_id = auth.uid() and role = 'admin') is not null
  );

---------------------------------------------------------------------------
-- SECTION 2 — workflow_steps (Workflow Configuration, S7)
---------------------------------------------------------------------------
create table if not exists public.workflow_steps (
  id           uuid      primary key default gen_random_uuid(),
  step_name    text      not null,
  department   text      not null,
  step_order   integer   not null,
  is_required  boolean   not null default true,
  auto_approve boolean   not null default false
);

grant select, insert, update, delete on public.workflow_steps to authenticated;
grant all on public.workflow_steps to service_role;

alter table public.workflow_steps enable row level security;

-- only admins can read/write workflow configuration
create policy "admins manage workflow_steps" on public.workflow_steps
  for all to authenticated
  using (
    (select role from public.user_roles where user_id = auth.uid() and role = 'admin') is not null
  )
  with check (
    (select role from public.user_roles where user_id = auth.uid() and role = 'admin') is not null
  );
