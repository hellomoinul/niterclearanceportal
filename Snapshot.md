# Project Snapshot — NITER Clearance Portal

**Last updated:** 22 Aug 2026 · **Overall progress: ~85%**

Baseline: the full student flow works end-to-end (register → apply → per-office sections → document upload → notifications → public verification). Staff can approve/reject with remarks, bulk approve, escalation fires at 3 rejections, every decision is audit-logged. All roles get email notifications. Profile page live.

**What's left:** Certificate page + PDF/QR (Fatin), Admin panel (Shafin).

## Status board

Legend: ✅ Done · 🚧 In progress · ⬜ Not started

### Foundation (done before division)

| Task                            | Owner   | Status  | Notes                                           |
| ------------------------------- | ------- | ------- | ----------------------------------------------- |
| Project scaffold                | Lovable | ✅ Done | TanStack Start, React 19, Tailwind 4, shadcn/ui |
| Database schema                 | Lovable | ✅ Done | All tables + RLS in `supabase/migrations/`      |
| DB automation triggers          | Lovable | ✅ Done | Fan-out reviews, auto-certificate, auto-notify  |
| Auth pages (sign-in / register) | Lovable | ✅ Done | NITER ID → email mapping                        |
| Apply form + student dashboard  | Lovable | ✅ Done | Progress %, per-office cards, remarks shown     |
| Section pages + doc upload      | Lovable | ✅ Done | Client validation, signed URLs, delete          |
| Notifications page (in-app)     | Lovable | ✅ Done | List + mark all read                            |
| Public pages (home/about/FAQ)   | Lovable | ✅ Done |                                                 |
| Certificate verify pages        | Lovable | ✅ Done | `/verify` + `/verify/$code`                     |

### Current sprint

| #   | Task                            | Owner  | Status         | Notes                                         |
| --- | ------------------------------- | ------ | -------------- | --------------------------------------------- |
| M1 | Staff queue `/queue` | Moinul | ✅ Done | Merged, deployed, E2E verified — staff approve/reject with remarks, student sees green card + notification |
| M2 | Escalation logic migration | Moinul | ✅ Done | E2E verified — auto-escalates at 3 rejections, notifies Head + admins via bell icon |
| M3 | Audit trail writes | Moinul | ✅ Done | E2E verified — every approve/reject logged to audit_log with actor + remark |
| F1  | Certificate page `/certificate` | Fatin  | ⬜ Not started | Route linked from dashboard, doesn't exist    |
| F2  | PDF download + QR code          | Fatin  | ⬜ Not started | `jspdf` + `qrcode`, QR → `/verify/$code`      |
| F3  | Forgot password flow            | Fatin  | ⬜ Not started | `resetPasswordForEmail` + reset form          |
| F4  | Profile page (read-only)        | Fatin  | ✅ Done | Merged via PR #11; layout fixed by Moinul (PortalShell + back button + nav link) |
| S1  | Admin: user management          | Shafin | ⬜ Not started | Roles + staff department assignment           |
| S2  | Admin: workflow config          | Shafin | ⬜ Not started | Departments per program, batch deadlines      |
| S3  | Admin: batch reports            | Shafin | ⬜ Not started | `recharts` installed                          |
| S4  | Admin: notices management       | Shafin | ⬜ Not started | Feeds Home page                               |
| S5  | Admin: audit log viewer         | Shafin | ⬜ Not started | Read-only table                               |

### Infrastructure (done by Moinul alongside the sprint)

| Task | Owner  | Status  | Notes                                                                    |
| ---- | ------ | ------- | ------------------------------------------------------------------------ |
| I1   | Own Supabase project | Moinul | ✅ Done | Old DB lived in inaccessible Lovable Cloud → new free project `jmpavfglhtmcraxfiock`, all migrations + fixes in `consolidated_setup.sql`, `.env` repointed |
| I2   | Deployed to Vercel | Moinul | ✅ Done | **https://niterclearanceportal.vercel.app/** · preset *Other* + env `NITRO_PRESET=vercel`; auto-redeploys every push to `main` |
| I3   | NITER branding | Moinul | ✅ Done | Favicon replaced |

### Stretch / deferred

| Task                        | Owner  | Status         | Notes                                                                                 |
| --------------------------- | ------ | -------------- | ------------------------------------------------------------------------------------- |
| Bulk approve in queue       | Moinul | ✅ Done    | Checkboxes + Select all + bottom action bar (PR #9) |
| Email notifications         | Moinul | ✅ Done    | Edge Function + Resend + Database Webhook live; triggers for admin/staff/student; settings page for email entry |
| Bangla/English toggle       | Moinul | ✅ Done    | i18n infrastructure + toggle in header (PR #10) |
| Notification pipeline       | Moinul | ✅ Done    | 3 triggers: admin on submission, staff on review creation, student on approve/reject. All fire emails via Resend. |
| Profile page fix            | Moinul | ✅ Done    | Wrapped in PortalShell, back button role-aware, user code links to /profile |
| **Firebase auth migration** | Moinul | ⬜ Deferred | Likely unnecessary now — we run our own free Supabase project; revisit only if a hard requirement appears |

## Work history

### 2026-08-22

- Repo cloned locally to `P:\My projects\niterclearanceportal`.
- Plan (`niter_clearance_portal_plan.md`) cross-checked against codebase: ~60% complete.
- Task division agreed among Moinul / Fatin / Shafin (see `Assignment.md`).
- Firebase deferred to final phase by team decision.
- **Kicked Lovable:** replaced its private build-config package with our own `vite.config.ts`,
  switched team to npm, rewrote README/AGENTS docs, enforced LF line endings repo-wide.
  Build also exposed a pre-existing bug (broken imports in `src/lib/portal.ts`) — fixed.
  Verified: lint ✓ · production build ✓ · dev server ✓ · prod server boots ✓
- **Approval loop built (M1–M3):** staff queue page (`/queue`) with pending/rejected tabs,
  document preview and remarks-required rejection; escalation + audit SQL migration ready.
  tsc, eslint and vite build all green. Awaiting merge → then apply migration in Supabase
  dashboard → live testing.
- **Database moved to our own Supabase project:** discovered the old DB lived in Lovable
  Cloud (inaccessible to us). Created free project `jmpavfglhtmcraxfiock`, applied
  `consolidated_setup.sql` (all 5 migrations + creates the missing `clearance-docs`
  bucket + modern `owner_id` storage policies), disabled email confirmation, `.env`
  repointed via PR #3. Live DB verified: 8 departments seeded.
- **Live on Vercel:** https://niterclearanceportal.vercel.app/ — Framework preset *Other*
  + env `NITRO_PRESET=vercel`; every push to `main` auto-redeploys, PRs get preview URLs.
  Favicon swapped for the NITER logo (PR #5).
- **E2E verified (M1–M3):** staff approve/reject → student green card + notification fires;
  escalation at 3 rejections → admin bell icon gets alert; every decision audit-logged.
  Live on Vercel, tested with real accounts.

- **Bug fixes during E2E:** PostgREST embed in queue query returned 400 (profiles linked
  through auth.users, invisible to the API) — split into two queries, merged client-side
  (PR #7). AFTER triggers for notifications + audit_log were missing from the new DB —
  recreated (PR #8).

- **Stretch pool completed (SP1–SP3):** bulk approve in queue (checkboxes + Select all + bottom
  action bar), email notifications via Resend Edge Function + Database Webhook (PR #10 —
  code done, user setup pending), Bangla/English language toggle with i18n infrastructure
  and browser language detection. All lint + build green. PR #10 contains all three.

- **Full notification pipeline built:** admin notified on application submission
  (`trg_notify_admin_on_application`), department staff notified on review creation
  (`trg_notify_staff_on_review`), student notified on approve/reject (existing
  `trg_notify_review_change`). All notifications fire emails via Resend Edge Function
  (Database Webhook on `notifications` table → `send-notification-email` → Resend API).
  Settings page (`/settings`) added so admin/staff can enter their `personal_email`.
  Dashboard auto-redirects admin/staff to queue. All migrations applied, lint + build green.

- **Fatin's PR #11 merged (profile page):** profile page merged to main. Fixed layout
  (wrapped in PortalShell, back button routes correctly for staff/admin vs students),
  added clickable user code link in header to `/profile`.

- **Git sync resolved:** pulled Fatin's PR #11, regenerated route tree with both /settings and
  /profile routes, resolved conflicts, lint + build green, pushed to main.

## Remaining summary

- **Moinul's work: 100% complete** — M1–M3, SP1–SP3, notification pipeline, infrastructure, profile fix all done.
- **Fatin's work: 1 of 4 tasks done** — Profile page (F4) merged. Certificate (F1), PDF/QR (F2), Forgot password (F3) still not started.
- **Shafin's work: 0 of 5 tasks done** — Admin panel (S1–S5) all not started. No `src/routes/_authenticated/admin/` folder exists yet.
- **What's next:** Fatin builds certificate page + PDF/QR. Shafin builds admin panel. Moinul is in support mode.
- **Definition of done for v1:** student applies → staff approves/rejects with remarks → escalation works → certificate PDF downloads with scannable QR → admin can manage users and see reports.

## How to update this file

When you finish or start a task: change its Status cell, add a dated bullet under Work history, then commit both this file and your code together.
